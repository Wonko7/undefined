(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page newarticle article base]]
        [undefined.sql :only [select_articles select_article select_authors select_categories
                              tags_by_article 
                              categories_by_article
                              authors_by_article]]
        [undefined.misc :only [format-date get_labels]]
        [undefined.content :only [remove-unsafe-tags str-to-int]]
        [noir.fetch.remotes]))

(defn blog-nav [link prev next]
  [(when prev
     {:tag :a :attrs {:href (str link "/" prev) :data-href link :data-args prev} :content "Previous"}) ;; FIXME: make something more generic
   (when next
     {:tag :a :attrs {:href (str link "/" next) :data-href link :data-args next :style "float: right"} :content "Next"})])

(defn mk-blog-cat-title [category]
  (if (= :blog category)
    "Undefined's Technical Blog"
    "Undefined's Latest News"))

(defn news-page [href article-id & [nb-articles]]
  (let [category         (if (= (take 4 href) (seq "blog")) :blog :news)
        single-art?      (= 1 nb-articles)
        nb-articles      (str-to-int nb-articles 10)
        article-id       (str-to-int article-id 0)
        [pv nx articles] (if single-art?
                           [nil nil (select_article article-id)]
                           (let [arts      (select_articles article-id (inc nb-articles) (name category))
                                 [arts nx] (if (> (count arts) nb-articles)
                                             [(drop-last arts) (+ article-id nb-articles)]
                                             [arts nil])
                                 pv (- article-id nb-articles)
                                 pv (if (neg? pv) 0 pv)]
                             [(when (> article-id 0) pv) nx arts]))]
    (page (mk-blog-cat-title category)
          (map #(article (:uid %) category (:title %) (format-date (:birth %)) (remove-unsafe-tags (:body %))
                         (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                         (str "Authors: " (get_labels (authors_by_article (:uid %)) :name)))
               articles)
          {:bottom (blog-nav href pv nx)
           :metadata {:data-href "news"
                      :data-args (name category)
                      :data-init-page "news"}})))


;FIXME add categories and authors
;FIXME use news/blog correctly
(defn update-article-div [href uid]
  (let [article (first (select_article uid))]
    (newarticle (select_authors) (select_categories) (:title article) (:body article)
                (get_labels (tags_by_article (:uid article)) :label) (:uid article)
                (authors_by_article (:uid article)) (categories_by_article (:uid article)))))

(defn refresh-article-div [href uid]
  (let [category (if (= (take 4 href) (seq "blog")) :blog :news)
        art      (first (select_article uid))]
    (article (:uid art) category (:title art) (format-date (:birth art)) (remove-unsafe-tags (:body art))
             (str "Tags: " (get_labels (tags_by_article (:uid art)) :label))
             (str "Authors: " (get_labels (authors_by_article (:uid art)) :name)))))

(add-page-init! "news-update-article-div" update-article-div)
(add-page-init! "blog-update-article-div" update-article-div)
(add-page-init! "news-refresh-article-div" refresh-article-div)
(add-page-init! "blog-refresh-article-div" refresh-article-div)

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
(add-page-init! "blog-article" #(news-page %1 %2 1) id)
(add-page-init! "news-article" #(news-page %1 %2 1) id)
(add-page-init! "news" #(news-page %1 %2) page)
(add-page-init! "blog" #(news-page %1 %2) page)
