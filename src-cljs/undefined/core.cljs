(ns undef.core
  (:use [undef.init :only [add-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(add-init! #(fm/letrem [x (testremote "lol")]
              (em/at js/document
                     [:#content] (em/append x))))
