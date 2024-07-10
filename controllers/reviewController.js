const { StatusCodes } = require('http-status-codes')
const Product = require('../models/Product')
const Review = require('../models/Review')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')

const createReview = async (req, res) => {
  const { product: productId } = req.body

  const isValidProduct = await Product.findOne({ _id: productId })
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id: ${productId}`)
  }

  const alreadyLeftReview = await Review.findOne({
    product: productId,
    user: req.user.userId,
  })

  if (alreadyLeftReview) {
    throw new CustomError.BadRequestError(
      'Already left review for this product'
    )
  }

  req.body.user = req.user.userId
  const review = await Review.create(req.body)
  res.status(StatusCodes.CREATED).json({ review })
}
const getAllReviews = async (req, res) => {
  const reviews = await Review.find({}).populate({
    path: 'product',
    select: 'name company price',
  })
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length })
}
const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId }).populate({
    path: 'product',
    select: 'name company price',
  })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id: ${reviewId}`)
  }
  res.status(StatusCodes.OK).json({ review })
}
const updateReview = async (req, res) => {
  const { id: reviewId } = req.params
  const { rating, comment, title } = req.body
  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id: ${reviewId}`)
  }
  checkPermissions(req.user, review.user)

  review.rating = rating
  review.comment = comment
  review.title = title

  await review.save()
  res.status(StatusCodes.OK).json({ review })
}
const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id: ${reviewId}`)
  }
  checkPermissions(req.user, review.user)
  await review.remove()
  res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' })
}

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params
  const review = await Review.find({ product: productId })
  res.status(StatusCodes.OK).json({ review, count: review.length })
}

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
}
