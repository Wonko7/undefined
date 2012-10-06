(ns undefined.server
(:import org.mindrot.jbcrypt.BCrypt)
  (:use [undefined.config :only [set-config!]]
        [undefined.sql :only [init-db-connection get_user_roles get_user]])
  (:require [noir.server :as server]
            [noir.session :as session]
            [noir.fetch.remotes :as remotes]
            [cemerick.friend :as friend]
            (cemerick.friend [workflows :as workflows]
                             [credentials :as creds])))

(server/load-views-ns 'undefined.views)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Authentication with friends:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; see https://github.com/cemerick/friend.git
;; and https://github.com/xeqi/friend-fetch-example

(defn fetch-workflow [request]
  (session/put! :id (friend/identity request))
  (when (= "/_fetch" (:uri request))
    (let [{:keys [remote params]} (:params request)
          [{:keys [user pass]}]   (remotes/safe-read params)]
      (when (= remote "auth-login")
        (if-let [user-record ((:credential-fn  (::friend/auth-config request))
                              ^{::friend/workflow :fetch-workflow}
                              {:username user :password pass})]
          (workflows/make-auth user-record
                               {::friend/workflow :fetch-workflow
                                ::friend/redirect-on-auth? false})
          {:status 401 :headers {"Content-Type" "text/plain"}
           :body ""})))))

(server/add-middleware friend/authenticate
                       {:credential-fn (partial creds/bcrypt-credential-fn (fn [name]
                                                                             (let [[user] (get_user {:username name})
                                                                                   roles (get_user_roles (:uid user))]
                                                                               (println (:uid user) roles)
                                                                               (println (into user {:roles (into #{} roles)}))
                                                                               (into user {:roles #{::admin}})
                                                                               )))
                        :workflows [#'fetch-workflow]
                        :unauthorized-handler (constantly
                                                {:status 401
                                                 :body (pr-str "Sorry, you do not have access to this resource.")})})

(defn fetch-logout [handler]
  (fn [request]
    (if (and (= "/_fetch" (:uri request))
             (= "auth-logout" (:remote (:params request))))
      (do
        (session/put! :id nil)
        ((friend/logout handler) request))
      (handler request))))

(server/add-middleware fetch-logout)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; server;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; FIXME make different ports for test build and release builds.
(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        conf (set-config! mode)]
    (init-db-connection conf)
    (server/start (:port conf) {:mode mode
                                :ns 'undefined
                                :jetty-options {:ssl? true
                                                :ssl-port (:ssl-port conf)
                                                ;; gen with: keytool -keystore keystore -alias jetty -genkey -keyalg RSA
                                                :keystore "keystore"
                                                :key-password "123456"}})))
