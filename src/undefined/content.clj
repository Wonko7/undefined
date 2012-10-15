(ns undefined.content
  (:use [undefined.views.common]
        [ring.util.codec])
  (:require [net.cgrand.enlive-html :as html]
            [noir.util.crypt :as nc]))

(html/defsnippet as-tree "templates/article.html" [:div.hack]
  [article]
  [:div.hack] (html/html-content article))

(def unsafe
  (let [safe-tags #{:a :div :span :section :p :article :br :big :small :center :img}]
    (html/pred #(not ((:tag %) safe-tags)))))

(defn remove-unsafe-tags [article]
  (html/transform (:content (first (as-tree article)))
                  [unsafe] (html/substitute "")))

(defn str-to-int [s & [fallback]]
  (let [fallback (or fallback 0)]
   (if (integer? s)
     s
     (if (string? s)
       (if-let [digits (re-find #"\d+" s)]
         (Integer/parseInt digits)
         fallback)
       fallback))))

(let  [lol (nc/encrypt "omg lolafasdf")]
  (println lol
           (url-encode lol)
           (url-decode "lol%24a." "utf-8")))
