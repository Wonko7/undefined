(ns undefined.views.common
  (:require [net.cgrand.enlive-html :as html]))

(html/deftemplate index "templates/index.html"
      [ctx]
      [:title]    (html/content "Undefined Development")
      [:#content] (html/content ctx))
