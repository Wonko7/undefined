(ns undefined.views.welcome
  (:require [undefined.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]))

;; this shall fuck off real quick.
(defpage "/welcome" []
         (common/layout
           [:p "Welcome to undefined"]))
