(ns undef.newarticle
  (:use [undef.pages :only [add-page-init!]])
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em]))

(defn by-id [id] (.getElementById js/document id))

(defn newarticlepage [href & [args]]
  (let [title (.-value (by-id "inp_title"));(em/from (by-id "#inp_title") (em/get-prop :value))
        body  (em/from js/document [:textarea#txt_body] (em/get-prop :value))]
    (js/console.log "called")
    (em/at js/document [:#btn_add_article] (em/listen :click #(js/alert (str "Title: " title "\nBody: " body))))));#(fm/letrem [res (insert_article title body)] (js/alert res))))))

(add-page-init! "newarticle" newarticlepage)
