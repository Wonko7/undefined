(ns undefined.views.admin
  (:use [noir.core :only [defpage pre-route]]
        [noir.response :only [redirect]]
        [noir.fetch.remotes]
        [undefined.views.common :only [base page login metadata]]) 
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

(defremote auth-login [auth]
  (friend/authorize #{:undefined.server/admin :undefined.server/user}
                    (:username (friend/current-authentication))))

(defremote auth-logout [] nil)

(defpage "/login" []
  (base  (page "Log In:"
               (login)
               {:metadata {:data-init-page "login"}})))
