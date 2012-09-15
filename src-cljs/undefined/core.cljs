(ns undefined.core
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(set! (.-onload js/window) #(fm/letrem [x (testremote "lol")]
                              (em/at js/document
                                ["#content"] (em/append x))))
