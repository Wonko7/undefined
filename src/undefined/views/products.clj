(ns undefined.views.products
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page product]]
        [noir.fetch.remotes]))

(defn products-page [name product-id]
  (let [title       "Undefined's Products"
        fb-desc     (str "Budget Splitter is an application designed to help you share a budget on outings with friends. "
                         "Alice rented a car for the trip which cost her $75, Bob pays $50 for gas & Charlie $25 worth of pizzas. "
                         "Bob paid $15 for two cinema tickets and popcorn. Alice didn't go and won't be participating in that expense. "
                         "How to we equalise the expenses? Budget Splitter to the rescue!"
                         "Budget Splitter targets WebKit browsers: Iphone, Android, Chrome & Safari." ;; FIXME contract on the user agent.
                         )
        link        "/products/budget-splitter/index.html"
        screenshot  "FIXME ADD SCREENSHOT"
        ]
    (page title (product "Budget Splitter" link fb-desc screenshot))))

(add-page-init! "products" products-page)
