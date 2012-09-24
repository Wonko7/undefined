(ns undefined.content
  (:use [undefined.views.common])
  (:require [net.cgrand.enlive-html :as html]))

(html/defsnippet as-tree "templates/article.html" [:div.content]
  [article]
  [:div.content] (html/html-content article))

(def unsafe
  (let [safe-tags #{:a :div :span :section :p :article :br :big :small}]
    (html/pred #(not ((:tag %) safe-tags)))))

(defn remove-unsafe-tags [article]
  (html/transform (as-tree article)
                  [unsafe] (html/substitute "")))

(defn str-to-int [s & [fallback]]
  (let [fallback (or fallback 0)]
   (if (integer? s)
     s
     (if (string? s)
       (if-let [digits (re-find #"\d+" s)]
         (Integer/parseInt s)
         fallback)
       fallback))))
