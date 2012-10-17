(ns undefined.views.reset_pass
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_reset_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page reset-pass]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn reset-password [user-id href token & [args]]
  (let [res (check_reset_token token)]
    (if (= -1 res)
      (page "Reset your password" "This token is not valid.")
      (page "Reset your password" (reset-pass)
          {:metadata {:data-init-page "reset"}}))))


(add-page-init! "reset" reset-password 1)
