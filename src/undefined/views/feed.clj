(ns undefined.views.feed
  (:use [undefined.views.common :only [atom-feed atom-entry]]
        [undefined.views.news :only [mk-blog-cat-title]]
        [undefined.content :only [remove-unsafe-tags]]
        [undefined.misc :only [format-date]]
        [undefined.sql :only [select_articles]]
        [noir.core :only [defpage]])
  (:require [net.cgrand.enlive-html :as html]))

(def url "http://localhost:8000") ;; get-config? FIXME

;; FIXME: needs at least authors, maybe tags.
;; include css?
(defn gen-feed [category]
  (let [[latest & as :as articles] (select_articles 0 100 (name category))
        mk-link #(str url "/" (name category) "-article/" %)]
   (atom-feed (mk-blog-cat-title category)
              url
              (str url "/news-feed")
              (format-date (:birth latest) :w3c)
              (map #(atom-entry (:title %) (mk-link (:uid %)) (format-date (:birth %) :w3c)
                                (apply str (html/emit* (remove-unsafe-tags (:body %))))) ;; FIXME: find a better workaround. apparently html/content doesn't escape trees, only strings.
                   articles))))

;; use :content to remove div.hack (without parsing the whole feed)
(defn- xmlns-workaround [feed]
  (concat ["<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" "<feed xmlns=\"http://www.w3.org/2005/Atom\">\n"]
          (html/emit* (:content (first feed)))
          ["</feed>"]))

(defpage "/news-feed" []
    (xmlns-workaround (gen-feed :news)))

(defpage "/blog-feed" []
    (xmlns-workaround (gen-feed :blog)))
