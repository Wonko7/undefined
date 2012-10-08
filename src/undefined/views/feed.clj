(ns undefined.views.feed
  (:use [undefined.views.common :only [atom-feed atom-entry atom-authors]]
        [undefined.views.news :only [mk-blog-cat-title]]
        [undefined.content :only [remove-unsafe-tags]]
        [undefined.config :only [get-config]]
        [undefined.misc :only [format-date]]
        [undefined.sql :only [select_articles authors_by_article]]
        [noir.core :only [defpage]])
  (:require [net.cgrand.enlive-html :as html]))


(defn gen-feed [category]
  (let [[latest & as :as articles] (select_articles 0 100 (name category))
        url                        (:domain (get-config))
        mk-link                    #(str url "/" (name category) "-article/" %)
        hard-code-style            #(html/at %
                                             [:div.code] (html/set-attr :style (str "font-family: 'Courier New', monospace;"
                                                                                    "white-space: pre-wrap;"
                                                                                    "word-wrap: break-word;")))
        emit-body                  (comp #(apply str %) html/emit* hard-code-style remove-unsafe-tags :body)]
   (atom-feed (mk-blog-cat-title category)
              url
              (str url "/" (name category) "-feed")
              (format-date (:birth latest) :w3c)
              (map #(atom-entry (:title %) (mk-link (:uid %)) (format-date (:birth %) :w3c) (emit-body %)
                                (map atom-authors (authors_by_article (:uid %))))
                   articles))))

;; use :content to remove div.hack (without parsing the whole feed)
(defn- xmlns-workaround [feed]
  (concat ["<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
           "<feed xmlns=\"http://www.w3.org/2005/Atom\">\n"]
          (html/emit* (:content (first feed)))
          ["</feed>"]))

(defpage "/news-feed" []
  (xmlns-workaround (gen-feed :news)))

(defpage "/blog-feed" []
  (xmlns-workaround (gen-feed :blog)))
