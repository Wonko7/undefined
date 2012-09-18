(ns undefined.sql
  ;(:require [net.cgrand.enlive-html :as html])
  (:use ;[noir.core :only [defpage]]
        ;[noir.statuses]
        ;[undefined.views.common :only [base page page-404]]
        [korma.db]
        [korma.core]))

(defdb undef-db (postgres {:db "undefined"
                           :user "web"
                           :password "droptableusers"
                           ;;OPTIONAL KEYS
                           :host "127.0.0.1"
                           :port "4567"
                           :delimiters "" ;; remove delimiters
                           :naming {:keys string/lower-case
                                    ;; set map keys to lower
                                    :fields string/upper-case}}))
