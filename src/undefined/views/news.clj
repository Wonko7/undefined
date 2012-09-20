(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        [undefined.sql :only [select_articles insert_article
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
        blognav      [{:tag :a :attrs {:href name :data-args article-prev} :content "Previous"} ;; FIXME: make something more generic
                      {:tag :a :attrs {:href name :data-args article-stop :style "float: right"} :content "Next"}]
        get_labels   (fn [x field] (reduce str (map #(str (field %) " ") x)))]

  (page title (concat (map 
                        #(article (:title %) (str (:birth %)) (:body %)
                                  (str "Tag: " (get_labels (tags_by_article (:uid %)) :label))
                                  (str "Categories: " (get_labels (categories_by_article (:uid %)) :label))
                                  (str "Authors: " (get_labels (authors_by_article (:uid %)) :name))
                                  %)
                        (select_articles article-id nb-articles))
                      blognav))))    
;  (page title (concat (map 
;                        #(article (:title %) (str (:birth %)) (:body %)
;                                  (tags_by_article (:uid %))
;                                  (categories_by_article (:uid %))
;                                  (authors_by_article (:uid %)))
;                        (select_articles article-id nb-articles))
;                      blognav))))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
