(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article base]]
        [undefined.sql :only [select_articles select_article
                              select_tags tags_by_article tags_by_label
                              select_categories categories_by_article
                              select_authors authors_by_article]]
        [noir.fetch.remotes]))


(defn news-page [name article-id & [nb-articles]]
  (let [category     (if (= (take 4 name) "blog") :blog :news)
        single-art   (= 1 nb-articles)
        title        (when (not single-art)
                       (if (= :blog category)
                       "Undefined's Technical Blog"
                       "Undefined's Latest News"))
        nb-articles  (if nb-articles nb-articles 10)
        article-id   (if article-id (Integer. article-id) 0) ;; FIXME add contracts on this. people can feed whatever here
        article-stop (+ article-id 10)
        article-prev (- article-id 10)
        article-prev (if (pos? article-prev) article-prev 0)
        blognav      (when (not single-art)
                       [{:tag :a :attrs {:href (str name "/" article-prev) :data-href name :data-args article-prev} :content "Previous"} ;; FIXME: make something more generic
                        {:tag :a :attrs {:href (str name "/" article-stop) :data-href name :data-args article-stop :style "float: right"} :content "Next"}])
        get_labels   (fn [x field] (reduce str (map #(str (field %) " ") x)))
        articles     (cond single-art         (select_article article-id)
                           (= :blog category) (select_articles article-id nb-articles "Technical")
                           :else              (select_articles article-id nb-articles "Promotional"))]
    (page title
          (map
            #(article (:uid %) category (:title %) (str (:birth %)) (:body %)
                      (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                      (str "Categories: " (get_labels (categories_by_article (:uid %)) :label))
                      (str "Authors: " (get_labels (authors_by_article (:uid %)) :name))
                      %)
            articles)
          {:bottom blognav})))


(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
(add-page-init! "blog-article" #(news-page %1 %2 1) id)
(add-page-init! "news-article" #(news-page %1 %2 1) id)
(add-page-init! "news" #(news-page %1 %2) page)
(add-page-init! "blog" #(news-page %1 %2) page)
