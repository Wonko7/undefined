(ns undef.news
  (:use [undef.pages :only [add-page-init!]])
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em]))

(defn newspage [href & [args]]
  (js/console.log "TEST__"))
;  (em/at js/document
;      [:#btn_del] (em/listen :click #(js/alert "Delete"))
;      [:#btn_upd] (em/listen :click #(js/alert "Update"))))

(add-page-init! "news" #(js/alert "test"))
