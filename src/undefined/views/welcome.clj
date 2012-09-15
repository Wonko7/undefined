(ns undefined.views.welcome
  (:require [net.cgrand.enlive-html :as html])
  (:use [noir.core :only [defpage]]
        [undefined.views.common :only [index]]))

;; this shall fuck off real quick.
(defpage "/welcome" []
         (index "a fucking string"))

(defpage "/" []
         (index "another fucking string"))
