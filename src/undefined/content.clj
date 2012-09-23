(ns undefined.content
  (:use [undefined.views.common])
  (:require [net.cgrand.enlive-html :as html]))

(html/defsnippet as-tree "templates/article.html" [:div.empty]
  [article]
  [:div.empty] (html/html-content article))

(def safe-tags #{:a :div :span :section :p :article :br})

(defn remove-unsafe-tags [article]
  (html/transform (as-tree article)
                  [(html/pred #(not ((:tag %) safe-tags)))] (html/substitute "")))
