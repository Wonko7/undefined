(ns undefined.auth
  (:use [noir.fetch.remotes]
        [noir.response :only [redirect]]
        [noir.request :only [ring-request]]
        [noir.core :only [pre-route]])
  (:require [net.cgrand.enlive-html :as html]
            [cemerick.friend :as friend]))

(def ssl-port 8084)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; auth remotes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defremote get-user []
  (let [{:keys [username roles] :as d} (friend/current-authentication)]
    [username roles]))

(defremote auth-login [auth]
  (let [{:keys [username roles]} (friend/current-authentication)]
    (friend/authorize #{:undefined.server/admin :undefined.server/user}
                      [username roles])))

(defremote auth-logout [] nil)

(pre-route "/login" []
           (let [req       (ring-request)
                 https-url (str "https://" (:server-name req) (str ":" ssl-port) (:uri req)) ]
             (when (= :http (:scheme req))
               (redirect https-url))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; wrappers for undefined:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn is-admin? []
  (friend/authorized? #{:undefined.server/admin}
                      friend/*identity*))
