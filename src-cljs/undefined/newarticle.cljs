(ns undef.newarticle
  (:use [undef.pages :only [add-page-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


(defn newarticlepage [href & [args]]
 ; (fm/letrem [user (get-text)]
    (em/at js/document [:#btn_add_article] (em/listen :click #(js/alert "test"))))

(add-page-init! "newarticle" newarticlepage)
