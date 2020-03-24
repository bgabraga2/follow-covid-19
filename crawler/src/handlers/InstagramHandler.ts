import Post from "../database/models/Post";
const instagramPosts = require("instagram-posts");
import { instagramAccounts, instagramSpecialWords } from "../data/data";
import logger from "node-color-log";
import moment from "moment-timezone";

export class InstagramHandler {
  constructor() {}

  async process() {
    logger.info("Fetching instagram posts...");
    const accounts = this.getAccounts();
    accounts.forEach(account => {
      this.getInstagramPostsByAccount(account);
    });
  }

  getAccounts() {
    return instagramAccounts;
  }

  async getInstagramPostById(socialId: string) {
    const instagramPost = await Post.findOne({
      socialId: socialId
    });
    return instagramPost;
  }

  async saveInstagramPost(instagramPost: any) {
    return await Post.create({
      type: "instagram",
      date: moment
        .unix(instagramPost.time)
        .tz("America/Sao_Paulo")
        .toDate(),
      user: instagramPost.username,
      url: instagramPost.url,
      socialId: instagramPost.id,
      text: instagramPost.text,
      fullJson: JSON.stringify(instagramPost)
    });
  }

  isAboutCovid(postText: string) {
    const specialWords = instagramSpecialWords;

    let isAbout = false;
    specialWords.forEach(word => {
      const n = postText.toLowerCase().search(word);
      if (n > 0) isAbout = true;
    });

    return isAbout;
  }

  async getInstagramPostsByAccount(account: string) {
    instagramPosts(account)
      .then((posts: any) => {
        posts.forEach(async (post: any) => {
          this.getInstagramPostById(post.id).then(async res => {
            if (!res && this.isAboutCovid(post.text))
              await this.saveInstagramPost(post);
          });
        });
      })
      .catch((err: any) => {
        console.error(
          `Erro ao pegar posts do instagram do usuário ${account}`,
          err
        );
      });
  }
}

export default new InstagramHandler();
