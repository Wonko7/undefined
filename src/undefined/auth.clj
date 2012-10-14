(ns undefined.auth
  (:use [noir.fetch.remotes]
        [noir.response :only [redirect]]
        [noir.request :only [ring-request]]
        [noir.core :only [pre-route]]
        [undefined.config :only [get-config]])
  (:require [net.cgrand.enlive-html :as html]
            [cemerick.friend :as friend]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; auth remotes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defremote get-user []
  (let [{:keys [username roles]} (friend/current-authentication)]
    [username roles]))

(defremote auth-login [auth]
  (let [{:keys [username roles]} (friend/current-authentication)]
    (friend/authorize #{:undefined.server/admin :undefined.server/user}
                      [username roles])))

(defremote auth-logout [] nil)

;; FIXME: also check requires-scheme
(pre-route "/login" []
           (let [req       (ring-request)
                 https-url (str "https://" (:server-name req) (str ":" (:ssl-port (get-config))) (:uri req))]
             (when (= :http (:scheme req))
               (redirect https-url))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; wrappers for undefined:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn is-admin? [id]
  (let [{:keys [roles]} (friend/current-authentication id)]
    (:undefined.server/admin roles)))

(defn username [id]
  (:username (friend/current-authentication id)))

(defn userid [id]
  (:uid (friend/current-authentication id)))
