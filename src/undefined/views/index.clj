(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html])
  (:use [noir.core :only [defpage]]
        [noir.fetch.remotes]
        [undefined.views.common :only [index]]))


(defpage "/" []
  (index "Loading..."))

(defremote get-page [href]
  href)
