(ns undefined.server
  (:require [noir.server :as server]
            [noir.fetch.remotes :as remotes]
            [cemerick.friend :as friend]
            (cemerick.friend [workflows :as workflows]
                             [credentials :as creds]) ))

(server/load-views-ns 'undefined.views)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Authentication with friends:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; see https://github.com/cemerick/friend.git
;; and https://github.com/xeqi/friend-fetch-example

(def users {"admin" {:username "admin" ;; FIXME tmp
                     :password (creds/hash-bcrypt "admin1")
                     :roles #{::admin}}
            "alice" {:username "alice"
                     :password (creds/hash-bcrypt "alice1")
                     :roles #{::user}}})

(defn fetch-workflow [request]
  (if (= "/_fetch" (:uri request))
    (let [{:keys [remote params]} (:params request)
          [{:keys [user pass]}] (remotes/safe-read params)]
      (if (= remote "auth-login")
        (if-let [user-record ((:credential-fn  (::friend/auth-config request))
                              ^{::friend/workflow :fetch-workflow}
                              {:username user :password pass})]
          (workflows/make-auth user-record
                               {::friend/workflow :fetch-workflow
                                ::friend/redirect-on-auth? false})
          {:status 401 :headers {"Content-Type" "text/plain"}
           :body ""})))))

(server/add-middleware friend/authenticate
                       {:credential-fn (partial creds/bcrypt-credential-fn users) ;; <-- this will change with db FIXME.
                        :workflows [#'fetch-workflow]
                        :unauthorized-handler
                        (constantly
                         {:status 401
                          :body (pr-str
                                 "Sorry, you do not have access to this resource.")})})

(defn fetch-logout [handler]
  (fn [request]
    (if (and (= "/_fetch" (:uri request))
             (= "logout" (:remote (:params request))))
      ((friend/logout handler) request)
      (handler request))))

(server/add-middleware fetch-logout)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; server;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; FIXME make different ports for test build and release builds.
(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (server/start port {:mode mode
                        :ns 'undefined
                        :jetty-options {:ssl? true
                                        :ssl-port 8084
                                        ;; gen with: keytool -keystore keystore -alias jetty -genkey -keyalg RSA
                                        :keystore "keystore"
                                        :key-password "123456"}}
                  )))
