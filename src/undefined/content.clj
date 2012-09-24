(ns undefined.content
  (:use [undefined.views.common])
  (:require [net.cgrand.enlive-html :as html]))

(html/defsnippet as-tree "templates/article.html" [:div.empty]
  [article]
  [:div.empty] (html/html-content article))

(def safe-tags #{:a :div :span :section :p :article :br :big :small})

(defn remove-unsafe-tags [article]
  (html/transform (as-tree article)
                  [(html/pred #(not ((:tag %) safe-tags)))] (html/substitute "")))

(defn str-to-int [s & [fallback]]
  (let [fallback (or fallback 0)]
   (if (integer? s)
     s
     (if (string? s)
       (if-let [digits (re-find #"\d+" s)]
         (Integer/parseInt s)
         fallback)
       fallback))))
