(ns undef.news
  (:use [undef.pages :only [add-page-init! page-click]])
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em]))

;TODO remove page click and remove the div instead
(defn newspage [href & [args]]
    (em/at js/document
        [:.whole-article :button] (em/listen :click #(js/alert (em/from (em/select [:.whole-article :button]) (em/get-attr :id))))))
;        [:.btn_del] (em/listen :click #(if(js/confirm (str "This will PERMANENTLY erase the article #"
;                                                       (em/from (em/select [:.btn_upd]) (em/get-attr :data-args))
;                                                        " from the database."))
;                                         (fm/letrem [res (delete_article uid)] (page-click "news" nil))))
;        [:.btn_upd] (em/listen :click #(js/alert (em/from (em/select [:#btn_upd]) (get-prop :value))))))
;                                        ;em/at js/document [] (em/substitute "Test"))))))

(add-page-init! "news" newspage)
