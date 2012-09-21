(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        [undefined.sql :only [select_articles
                              select_tags tags_by_article tags_by_label
                              select_categories categories_by_article
                              select_authors authors_by_article]]
        [noir.fetch.remotes]))

(defn news-page [name article-id]
  (let [title        (if (= name "blog")
                       "Undefined's Technical Blog"
                       "Undefined's Latest News")
        nb-articles  10
        article-id   (if article-id (Integer. article-id) 0) ;; FIXME add contracts on this. people can feed whatever here
        article-stop (+ article-id 10)
        article-prev (- article-id 10)
        article-prev (if (pos? article-prev) article-prev 0)
        blognav      [{:tag :a :attrs {:href (str name "/" article-prev) :data-href name :data-args article-prev} :content "Previous"} ;; FIXME: make something more generic
                      {:tag :a :attrs {:href (str name "/" article-stop) :data-href name :data-args article-stop :style "float: right"} :content "Next"}]
        get_labels   (fn [x field] (reduce str (map #(str (field %) " ") x)))]

  (page title
        (map
          #(article (:title %) (str (:birth %)) (:body %)
                    (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                    (str "Categories: " (get_labels (categories_by_article (:uid %)) :label))
                    (str "Authors: " (get_labels (authors_by_article (:uid %)) :name))
                    %)
          (select_articles article-id nb-articles))
        {:bottom blognav})))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
