(ns undefined.auth
  (:use [noir.fetch.remotes]) 
  (:require [net.cgrand.enlive-html :as html]
            [cemerick.friend :as friend]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; auth remotes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defremote get-user []
  (:username (friend/current-authentication)))

(defremote auth-login [auth]
  (friend/authorize #{:undefined.server/admin :undefined.server/user}
                    (:username (friend/current-authentication))))

(defremote auth-logout [] nil)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; wrappers for undefined:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn is-admin? []
  (friend/authorized? #{:undefined.server/admin}
                      friend/*identity*))
