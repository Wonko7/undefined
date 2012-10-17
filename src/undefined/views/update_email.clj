(ns undefined.views.update-email
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_update_email_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(add-page-init! "update" #(page "Email address update"
                                  {:tag :div :attrs {:class "whole-article"}
                                   :content [{:tag :div :attrs {:class "article"}
                                              :content [(check_update_email_token %3)]}]}
                                  ;{:metadata {:data-init-page "404"}};; FIXME I decided against redirect. user should se result even if he goes to get coffee.
                                  )
                1)
