(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html])
  (:use [noir.core :only [defpage]]
        [noir.fetch.remotes]
        [undefined.views.common :only [index]]))

(defpage "/welcome" []
  (index "a fucking string"))

(defpage "/" []
  (index "another fucking string"))

(defremote testremote [arg]
  (str arg " omg lol"))
