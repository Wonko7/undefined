(ns undefined.core
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm]))

(set! (.-onload js/window) #(js/console.log (fm/letrem [x (testremote "lol")]
                                                (js/console.log x))))
