(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html])
  (:use [noir.core :only [defpage]]
        [noir.fetch.remotes]
        [undefined.views.common :only [base page]]))

(defpage "/" []
  (base (page "Loading..." "")))
