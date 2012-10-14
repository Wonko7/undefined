(ns undefined.views.auth-token
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [activate_user]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(add-page-init! "validate" #(page "Account Validation"
                                  {:tag :div :attrs {:class "whole-article"}
                                   :content [{:tag :div :attrs {:class "article"}
                                              :content [(activate_user %3)]}]}
                                  {:metadata {:data-init-page "404"}})
                1)
