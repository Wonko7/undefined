(ns undefined.views.newarticle
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page newarticle]]
        [undefined.sql :only [select_articles insert_article insert_article2
                              select_tags tags_by_article tags_by_label
                              select_categories categories_by_article
                              select_authors authors_by_article]]
        [noir.fetch.remotes]))

(defn new-article-page [name article-id]
  (let [title        "Add a new post"]
  (page title
        (newarticle "New titre" "New body" "New tags")
        [{:tag :p :content "Bottom stuff"}])))    

(add-page-init! "newarticle" new-article-page)
