(ns undefined.views.products
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page product]]
     [undefined.content :only [remove-unsafe-tags str-to-int]]
     [undefined.sql :only [select_products]]
     [noir.fetch.remotes]))

(defn products-page [user-id name product-id]
  (let [title       "Undefined's Products"
        products    (select_products)]
    (page title 
          (map #(product (:title %) (:link %) (remove-unsafe-tags (:description %)) (:screenshot %) (when (re-find #"Budget" (:title %)) "restrict-webkit-only"))
               products))))
;; FIXME restrictions are hardcoded until we decide how to use platforms in db.

(add-page-init! "products" products-page)
