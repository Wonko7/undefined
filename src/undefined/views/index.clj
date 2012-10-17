(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html]
            [noir.session :as session])
  (:use [noir.core :only [defpage]]
        [noir.statuses]
        [undefined.views.common :only [base page page-404]]))

(defpage "/" []
  (base (session/get :id) (page "Loading..." "")))

(set-page! 404 (base nil page-404))
