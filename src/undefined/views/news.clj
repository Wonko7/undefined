(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article base]]
        [undefined.sql :only [select_articles select_article
                              tags_by_article 
                              categories_by_article
                              authors_by_article]]
        [undefined.misc :only [format-date]]
        [undefined.content :only [remove-unsafe-tags str-to-int]]
        [noir.fetch.remotes]))


(defn blog-nav [link prev next]
  [(when prev
     {:tag :a :attrs {:href (str link "/" prev) :data-href link :data-args prev} :content "Previous"}) ;; FIXME: make something more generic
   (when next
     {:tag :a :attrs {:href (str link "/" next) :data-href link :data-args next :style "float: right"} :content "Next"})])

(defn news-page [name article-id & [nb-articles]]
  (let [category         (if (= (take 4 name) (seq "blog")) :blog :news)
        single-art?      (= 1 nb-articles)
        title            (if (= :blog category) "Undefined's Technical Blog" "Undefined's Latest News")
        nb-articles      (str-to-int nb-articles 10)
        article-id       (str-to-int article-id 0)
        get_labels       #(apply str (interpose " " (map %2 %1)))
        [pv nx articles] (if single-art?
                           [nil nil (select_article article-id (if (= :blog category) "Technical" "Promotional"))]
                           (let [arts      (select_articles article-id (inc nb-articles) (if (= :blog category) "Technical" "Promotional"))
                                 [arts nx] (if (> (count arts) nb-articles)
                                             [(drop-last arts) (+ article-id nb-articles)]
                                             [arts nil])
                                 pv (- article-id nb-articles)
                                 pv (if (neg? pv) 0 pv)]
                             [(when (> article-id 0) pv) nx arts]))]
    (page title
          (map #(article (:uid %) category (:title %) (format-date (:birth %)) (remove-unsafe-tags (:body %))
                         (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                         (str "Categories: " (get_labels (categories_by_article (:uid %)) :label))
                         (str "Authors: " (get_labels (authors_by_article (:uid %)) :name)))
               articles)
          {:bottom (blog-nav name pv nx)
           :metadata {:data-init-page "news"}})))


(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
(add-page-init! "blog-article" #(news-page %1 %2 1) id)
(add-page-init! "news-article" #(news-page %1 %2 1) id)
(add-page-init! "news" #(news-page %1 %2) page)
(add-page-init! "blog" #(news-page %1 %2) page)
