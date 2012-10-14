(ns undefined.views.reset_pass
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.sql :only [check_reset_token]]
        [undefined.config :only [get-config]]
        [undefined.views.common :only [add-page-init! page]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; token validation:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(add-page-init! "reset" #(page "Reset your password"
                                  {:tag :div :attrs {:class "whole-article"}
                                   :content [{:tag :div :attrs {:class "article"}
                                              :content [(str "This is the user that wants to reset his pass, do something about it here: "
                                                             (check_reset_token %3)
                                                             "\n\n (calling update_pass seems like a good idea)")]}]})
                                  ;{:metadata {:data-init-page "404"}})
                1)
