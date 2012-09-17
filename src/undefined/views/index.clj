(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html])
  (:use [noir.core :only [defpage]]
        [noir.statuses]
        [undefined.views.common :only [base page page-404]]))

(defpage "/" []
  (base (page "Loading..." "")))

(set-page! 404 (base page-404))
