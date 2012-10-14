(ns undefined.content
  (:use [undefined.views.common])
  (:require [net.cgrand.enlive-html :as html]
            [clojure.string :as string]))

(html/defsnippet as-tree "templates/article.html" [:div.content]
  [article]
  [:div.content] (html/html-content article))

(def unsafe
  (let [safe-tags #{:a :div :span :section :p :article :br :big :small :center :img}]
    (html/pred #(not ((:tag %) safe-tags)))))

(defn remove-unsafe-tags [article]
  (html/transform (:content (first (as-tree article)))
                  [unsafe] (html/substitute "")))

(defn to_html [input] (string/replace input #"\n" "<br/>"))

(defn str-to-int [s & [fallback]]
  (let [fallback (or fallback 0)]
   (if (integer? s)
     s
     (if (string? s)
       (if-let [digits (re-find #"\d+" s)]
         (Integer/parseInt digits)
         fallback)
       fallback))))
