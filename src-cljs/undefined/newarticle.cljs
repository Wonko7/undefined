(ns undef.newarticle
  (:use [undef.pages :only [add-page-init!]])
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em]))

(defn newarticlepage [href & [args]]
  ;(js/console.log "called")
  (em/at js/document [:#btn_add_article] (em/listen :click #(let [title (em/from (em/select ["#inp_title"]) (em/get-prop :value))
                                                                  body  (em/from (em/select ["#txt_body"]) (em/get-prop :value))]
                                                              (fm/letrem [res (insert_article title body)] (js/alert res))))))

(add-page-init! "newarticle" newarticlepage)
