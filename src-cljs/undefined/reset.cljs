(ns undef.reset
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]]
        [undef.misc :only [restore-height]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn reset-page [href & [args]] 
  (js/console.log "Everything's good"))

(add-page-init! "reset" reset-page)
