(ns undefined.content
  (:use [undefined.views.common])
  ;(:import (java.net URLEncoder URLDecoder)
  ;         [org.owasp.antisamy])
  ;;         org.owasp.antisamy.antisamy)
  (:import [org.owasp.validator.html AntiSamy CleanResults]
           [java.net URLEncoder URLDecoder])
  (:require [net.cgrand.enlive-html :as html]
            [noir.util.crypt :as nc]))

(html/defsnippet as-tree "templates/article.html" [:div.hack]
  [article]
  [:div.hack] (html/html-content article))

(def unsafe
  (let [safe-tags #{:a :b :i :tt :sub :sup :div :span :section :p :article :br :big :small :center :img :ul :li :dd :ol}]
    (html/pred #(not ((:tag %) safe-tags)))))

(defn remove-unsafe-tags [article]
  (println article)
  (-> (AntiSamy.)
    (.scan article "resources/antisamy-tinymce-1.4.4.xml")
    .getCleanHTML
    as-tree)
  )

(defn str-to-int [s & [fallback]]
  (let [fallback (or fallback 0)]
   (if (integer? s)
     s
     (if (string? s)
       (if-let [digits (re-find #"\d+" s)]
         (Integer/parseInt digits)
         fallback)
       fallback))))

(defn url-encode [s]
  (URLEncoder/encode s "utf-8"))

(defn url-decode [s]
  (URLDecoder/decode s "utf-8"))
