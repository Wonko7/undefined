(ns undefined.views.reset_pass
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_reset_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page reset-pass]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn reset-password [user-id href token & [args]]
  (do
    (println (str "\n\nToken" token "\n\n"))
    (let [res (check_reset_token token)]
      (if (= -1 res)
        (page "Reset your password" (reset-pass "Invalid Link"))
        (page "Reset your password" (reset-pass "Token"))))))


(add-page-init! "reset" reset-password 1)
