(ns undefined.views.admin
  (:use [noir.core :only [defpage pre-route]]
        [noir.response :only [redirect]]
        [noir.fetch.remotes]
  (:require [net.cgrand.enlive-html :as html]
            [noir.session :as session]
            [noir.server :as server]
            [cemerick.friend :as friend]
            (cemerick.friend [workflows :as workflows]
                             [credentials :as creds])))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; auth remotes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defremote get-user []
  (:username (friend/current-authentication)))

(defremote login [auth]
  (friend/authorize #{:friendly.server/user}
                    (:username (friend/current-authentication))))

(defremote logout [] nil)
