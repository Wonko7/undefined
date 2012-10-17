(ns undefined.views.reset_pass
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_reset_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page reset-pass]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn reset-password [token & [args]]
  (let [res (check_reset_token token)]
    (if (= -1 res)
      (page "Reset your password" "Invalid Link")
      (page "Reset your password" reset-pass))))


(add-page-init! "reset" #(reset-password %))
