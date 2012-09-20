(ns undefined.views.newarticle
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page newarticle page-404]]
     [undefined.sql :only [select_articles insert_article insert_article2
                           select_tags tags_by_article tags_by_label
                           select_categories categories_by_article
                           select_authors authors_by_article]]
     [undefined.auth :only [is-admin?]]
     [noir.fetch.remotes]
     [noir.core :only [defpage pre-route]]))

(defremote get-text [] ("test"))

(defn new-article-page [name id]
  (if (is-admin?)
    (page "Add a new post" 
          (newarticle (select_authors) (select_categories))
          {:metadata {:data-init-page "newarticle"}})
    page-404))

(add-page-init! "newarticle" new-article-page)
