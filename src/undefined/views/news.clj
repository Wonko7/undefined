(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article base]]
        [undefined.sql :only [select_articles select_article
                              select_tags tags_by_article tags_by_label
                              select_categories categories_by_article
                              select_authors authors_by_article]]
        [noir.fetch.remotes]))


(defn blog-nav [link prev next]
  [(when prev
     {:tag :a :attrs {:href (str link "/" prev) :data-href link :data-args prev} :content "Previous"}) ;; FIXME: make something more generic
   (when next
     {:tag :a :attrs {:href (str link "/" next) :data-href link :data-args next :style "float: right"} :content "Next"})])

(defn news-page [name article-id & [nb-articles]]
  (let [category         (if (= (take 4 name) "blog") :blog :news)
        single-art?      (= 1 nb-articles)
        title            (when (not single-art?)
                           (if (= :blog category) "Undefined's Technical Blog" "Undefined's Latest News"))
        nb-articles      (if nb-articles nb-articles 10)
        article-id       (if article-id (Integer. article-id) 0) ;; FIXME add contracts on this. people can feed whatever here
        get_labels       #(apply str (interpose " " (map %2 %1)))
        [pv nx articles] (if single-art?
                           [nil nil (select_article article-id)]
                           (let [arts      (select_articles article-id (inc nb-articles) (if (= :blog category) "Technical" "Promotional"))
                                 [arts nx] (if (> (count arts) nb-articles)
                                             [(drop-last arts) (+ article-id nb-articles)]
                                             [arts nil])
                                 pv (- article-id nb-articles)]
                             [(when (pos? pv) pv) nx arts]))]
    (page title
          (map
            #(article (:uid %) category (:title %) (str (:birth %)) (:body %)
                      (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                      (str "Categories: " (get_labels (categories_by_article (:uid %)) :label))
                      (str "Authors: " (get_labels (authors_by_article (:uid %)) :name))
                      %)
            articles)
          {:bottom (blog-nav name pv nx)})))


(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
(add-page-init! "blog-article" #(news-page %1 %2 1) id)
(add-page-init! "news-article" #(news-page %1 %2 1) id)
(add-page-init! "news" #(news-page %1 %2) page)
(add-page-init! "blog" #(news-page %1 %2) page)
