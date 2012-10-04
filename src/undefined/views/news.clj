(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page newarticle article base]]
        [undefined.sql :only [select_articles select_article select_authors select_categories
                              tags_by_article articles_by_tags
                              categories_by_article
                              authors_by_article]]
        [undefined.auth :only [is-admin?]]
        [undefined.misc :only [format-date get_labels]]
        [undefined.content :only [remove-unsafe-tags str-to-int]]
        [noir.fetch.remotes]))

(defn blog-nav [link prev next]
  [(when prev
     {:tag :a :attrs {:href (str link "/" prev) :data-href link :data-args prev} :content "Previous"}) ;; FIXME: make something more generic
   (when next
     {:tag :a :attrs {:href (str link "/" next) :data-href link :data-args next :style "float: right"} :content "Next"})])

(defn get-category [href type]
  (cond (= type :tag)       :tag
        (= (first href) \b) :blog 
        :else               :news))

(defn mk-blog-cat-title [category]
  (condp = type 
    :blog "Undefined's Technical Blog"
    :news "Undefined's Latest News"
          "Undefined's Articles"))

(defn news-page [user-id href type id]
  (let [id               (str-to-int id)
        category         (get-category href type)
        nb-articles      10
        articles         (condp = type
                           :single (select_article id)
                           :page   (select_articles id (inc nb-articles) (name category))
                           :tag    (mapcat #(select_article (:uid %)) (articles_by_tags id 0 nb-articles))) ;; FIXME william; it doesn't, the offset needs to be set somehow (temp->0); cyrille ; does this look good to you?
        [pv nx articles] (if (= type :single)
                           [nil nil articles]
                           (let [[arts nx] (if (> (count articles) nb-articles)
                                             [(drop-last articles) (+ id nb-articles)]
                                             [articles nil])
                                 pv (- id nb-articles)
                                 pv (if (neg? pv) 0 pv)]
                             [(when (> id 0) pv) nx arts]))
        admin?           (is-admin? user-id)]
    (page (mk-blog-cat-title category)
          (map #(article (:uid %) category (:title %) (format-date (:birth %)) (remove-unsafe-tags (:body %))
                         (str "Tags: " (get_labels (tags_by_article (:uid %)) :label))
                         (str "Authors: " (get_labels (authors_by_article (:uid %)) :name))
                         admin?)
               articles)
          {:bottom (blog-nav href pv nx)
           :metadata {:data-init-page "news"}})))


(defn update-article-div [user-id href uid]
  (let [article (first (select_article uid))]
    (newarticle (select_authors) (select_categories) (:title article) (:body article)
                (get_labels (tags_by_article (:uid article)) :label) (:uid article)
                (authors_by_article (:uid article)) (categories_by_article (:uid article)))))

(defn refresh-article-div [user-id href uid]
  (let [category (if (= (take 4 href) (seq "blog")) :blog :news)
        art      (first (select_article uid))]
    (article (:uid art) category (:title art) (format-date (:birth art)) (remove-unsafe-tags (:body art))
             (str "Tags: " (get_labels (tags_by_article (:uid art)) :label))
             (str "Authors: " (get_labels (authors_by_article (:uid art)) :name))
             (is-admin? user-id))))

(add-page-init! "update-article-div" update-article-div)
(add-page-init! "refresh-article-div" refresh-article-div)

(add-page-init! "news" #(news-page %1 %2 :page (or 0 %3))) ;; always evals to 0 but reference %3 for compiler.
(add-page-init! "blog" #(news-page %1 %2 :page (or 0 %3)))
(add-page-init! "blog-article" #(news-page %1 %2 :single %3) id)
(add-page-init! "news-article" #(news-page %1 %2 :single %3) id)
(add-page-init! "news" #(news-page %1 %2 :page %3) page)
(add-page-init! "blog" #(news-page %1 %2 :page %3) page)
(add-page-init! "tag"  #(news-page %1 %2 :tag  %3) tag)
