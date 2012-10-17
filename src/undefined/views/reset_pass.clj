(ns undefined.views.reset_pass
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_reset_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page reset-pass]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn reset-password []
  (let [res (check_reset_token %3)]
    (if (= -1 res)
      (page "Invalid Link")
      (page reset-pass))))


(add-page-init! "reset" reset-password) 
