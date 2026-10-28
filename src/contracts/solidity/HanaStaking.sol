// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IHANAToken {
    function mint(address to, uint256 amount) external;
    function addLiquidity(uint256 usdtAmount, uint256 hanaAmount) external;
    function buybackAndBurn(uint256 usdtAmount) external returns (uint256);
    function getPrice() external view returns (uint256);
}

contract HanaStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IHANAToken public hanaToken;
    IERC20 public usdtToken;

    struct Package {
        uint256 minAmount;
        uint256 dailyRateBps;
        uint256 capMultiplier;
        bool isDAO;
        bool active;
    }

    struct StakeInfo {
        uint256 packageId;
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 totalClaimed;
        uint256 cap;
        bool active;
    }

    struct User {
        address referrer;
        uint256 totalStaked;
        uint256 totalDirectIncome;
        uint256 totalLevelIncome;
        uint256 totalRankIncome;
        uint256 totalWithdrawn;
        uint256 lastWithdrawalTime;
        uint256 firstStakeTime;
        bool isDAO;
        uint256 daoJoinTime;
        uint256 daoEndTime;
        StakeInfo[] stakes;
    }

    Package[] public packages;
    mapping(address => User) public users;
    mapping(address => bool) public isRegistered;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TWELVE_HOURS = 12 hours;

    uint256 public adminFeeBps = 500;
    uint256 public swapFeeBps = 500;
    uint256 public ecosystemFeeBps = 2000;
    uint256 public maxWithdrawalPerDay = 2500e18;
    uint256 public coolingPeriod = 24 hours;
    uint256 public daoMemberCount;
    uint256 public constant MAX_DAO_MEMBERS = 300;

    address public treasury;
    address public daoPool;
    address public reinvestWallet;

    event Registered(address indexed user, address indexed referrer);
    event Staked(address indexed user, uint256 packageId, uint256 amount, uint256 stakeIndex);
    event ROIClaimed(address indexed user, uint256 stakeIndex, uint256 usdtEquivalent, uint256 hanaMinted);
    event DirectIncomePaid(address indexed from, address indexed to, uint256 amount);
    event Withdrawn(address indexed user, uint256 gross, uint256 net, uint256 fee);
    event PackageAdded(uint256 indexed id, uint256 minAmount, uint256 rateBps, uint256 cap);
    event DAOJoined(address indexed user, uint256 endTime);

    constructor(
        address _hanaToken,
        address _usdt,
        address _treasury,
        address _daoPool,
        address _reinvestWallet
    ) Ownable(msg.sender) {
        hanaToken = IHANAToken(_hanaToken);
        usdtToken = IERC20(_usdt);
        treasury = _treasury;
        daoPool = _daoPool;
        reinvestWallet = _reinvestWallet;

        _addPackage(10e18, 20, 2, false);
        _addPackage(100e18, 50, 2, false);
        _addPackage(300e18, 60, 2, false);
        _addPackage(500e18, 70, 2, false);
        _addPackage(1000e18, 100, 2, false);
        _addPackage(5000e18, 100, 3, true);
    }

    function register(address referrer) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(referrer != msg.sender, "Self referral");
        if (referrer != address(0)) {
            require(isRegistered[referrer], "Referrer not registered");
        }
        users[msg.sender].referrer = referrer;
        isRegistered[msg.sender] = true;
        emit Registered(msg.sender, referrer);
    }

    function stake(uint256 packageId, uint256 amount) external nonReentrant {
        require(isRegistered[msg.sender], "Register first");
        require(packageId < packages.length, "Invalid package");
        Package memory pkg = packages[packageId];
        require(pkg.active, "Package inactive");
        require(amount >= pkg.minAmount, "Below minimum");

        if (pkg.isDAO) {
            require(amount % 1000e18 == 0, "DAO topup must be multiple of 1000");
            if (!users[msg.sender].isDAO) {
                require(daoMemberCount < MAX_DAO_MEMBERS, "DAO full");
            }
        }

        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

        // 5% Direct
        address referrer = users[msg.sender].referrer;
        uint256 directReward = 0;
        if (referrer != address(0)) {
            directReward = (amount * 500) / BASIS_POINTS;
            usdtToken.safeTransfer(referrer, directReward);
            users[referrer].totalDirectIncome += directReward;
            emit DirectIncomePaid(msg.sender, referrer, directReward);
        }

        // 50% Liquidity
        uint256 liquidityUsdt = (amount * 5000) / BASIS_POINTS;
        usdtToken.safeTransfer(address(hanaToken), liquidityUsdt);
        hanaToken.addLiquidity(liquidityUsdt, 0);

        // 25% Buyback + Burn
        uint256 buybackUsdt = (amount * 2500) / BASIS_POINTS;
        usdtToken.safeTransfer(address(hanaToken), buybackUsdt);
        hanaToken.buybackAndBurn(buybackUsdt);

        // 20% Treasury
        uint256 remaining = amount - directReward - liquidityUsdt - buybackUsdt;
        if (remaining > 0) {
            usdtToken.safeTransfer(treasury, remaining);
        }

        uint256 stakeIndex = users[msg.sender].stakes.length;
        uint256 cap = amount * pkg.capMultiplier;

        users[msg.sender].stakes.push(StakeInfo({
            packageId: packageId,
            amount: amount,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            totalClaimed: 0,
            cap: cap,
            active: true
        }));

        users[msg.sender].totalStaked += amount;
        if (users[msg.sender].firstStakeTime == 0) {
            users[msg.sender].firstStakeTime = block.timestamp;
        }

        if (pkg.isDAO && !users[msg.sender].isDAO) {
            users[msg.sender].isDAO = true;
            users[msg.sender].daoJoinTime = block.timestamp;
            users[msg.sender].daoEndTime = block.timestamp + 500 days;
            daoMemberCount++;
            emit DAOJoined(msg.sender, users[msg.sender].daoEndTime);
        }

        emit Staked(msg.sender, packageId, amount, stakeIndex);
    }

    function claimROI(uint256 stakeIndex) external nonReentrant {
        User storage user = users[msg.sender];
        require(stakeIndex < user.stakes.length, "Invalid stake");
        StakeInfo storage st = user.stakes[stakeIndex];
        require(st.active, "Inactive");

        uint256 pending = pendingROI(msg.sender, stakeIndex);
        require(pending > 0, "Nothing to claim");

        uint256 claimable = pending;
        if (st.totalClaimed + claimable > st.cap) {
            claimable = st.cap - st.totalClaimed;
            st.active = false;
        }

        st.totalClaimed += claimable;
        st.lastClaimTime = block.timestamp;

        uint256 hanaAmount = _usdtToHana(claimable);
        hanaToken.mint(msg.sender, hanaAmount);

        emit ROIClaimed(msg.sender, stakeIndex, claimable, hanaAmount);
    }

    function pendingROI(address userAddr, uint256 stakeIndex) public view returns (uint256) {
        User memory user = users[userAddr];
        if (stakeIndex >= user.stakes.length) return 0;
        StakeInfo memory st = user.stakes[stakeIndex];
        if (!st.active) return 0;

        Package memory pkg = packages[st.packageId];
        uint256 periods = (block.timestamp - st.lastClaimTime) / TWELVE_HOURS;
        if (periods == 0) return 0;

        uint256 ratePer12h = pkg.dailyRateBps / 2;
        return (st.amount * ratePer12h * periods) / BASIS_POINTS;
    }

    function withdraw(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0 && usdtAmount <= maxWithdrawalPerDay, "Invalid amount");
        User storage user = users[msg.sender];
        require(block.timestamp >= user.lastWithdrawalTime + coolingPeriod, "Cooling");

        uint256 feeBps = adminFeeBps + swapFeeBps + ecosystemFeeBps;
        bool reducedFee = user.firstStakeTime > 0 && block.timestamp >= user.firstStakeTime + 45 days;

        if (reducedFee) feeBps = 1000;

        uint256 fee = (usdtAmount * feeBps) / BASIS_POINTS;
        uint256 net = usdtAmount - fee;

        usdtToken.safeTransfer(msg.sender, net);

        if (fee > 0) {
            if (reducedFee) {
                uint256 half = fee / 2;
                usdtToken.safeTransfer(treasury, half);
                usdtToken.safeTransfer(reinvestWallet, fee - half);
            } else {
                uint256 adminPart = (fee * adminFeeBps) / (adminFeeBps + swapFeeBps + ecosystemFeeBps);
                usdtToken.safeTransfer(treasury, adminPart);
                usdtToken.safeTransfer(daoPool, fee - adminPart);
            }
        }

        user.totalWithdrawn += usdtAmount;
        user.lastWithdrawalTime = block.timestamp;
        emit Withdrawn(msg.sender, usdtAmount, net, fee);
    }

    function distributeLevelIncome(address to, uint256 amount) external onlyOwner {
        usdtToken.safeTransfer(to, amount);
        users[to].totalLevelIncome += amount;
    }

    function distributeRankIncome(address to, uint256 amount) external onlyOwner {
        usdtToken.safeTransfer(to, amount);
        users[to].totalRankIncome += amount;
    }

    function distributeDAOPool(address[] calldata members, uint256 totalAmount) external onlyOwner {
        require(members.length > 0, "Empty");
        uint256 per = totalAmount / members.length;
        for (uint256 i = 0; i < members.length; ) {
            usdtToken.safeTransfer(members[i], per);
            unchecked { ++i; }
        }
    }

    function _addPackage(uint256 minAmount, uint256 rateBps, uint256 cap, bool isDAO) internal {
        packages.push(Package(minAmount, rateBps, cap, isDAO, true));
        emit PackageAdded(packages.length - 1, minAmount, rateBps, cap);
    }

    function addPackage(uint256 minAmount, uint256 rateBps, uint256 cap, bool isDAO) external onlyOwner {
        _addPackage(minAmount, rateBps, cap, isDAO);
    }

    function setPackageActive(uint256 id, bool active) external onlyOwner {
        packages[id].active = active;
    }

    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return users[user].stakes;
    }

    function packageCount() external view returns (uint256) {
        return packages.length;
    }

    function _usdtToHana(uint256 usdtAmount) internal view returns (uint256) {
        uint256 price = hanaToken.getPrice();
        return price == 0 ? 0 : (usdtAmount * 1e18) / price;
    }

    function rescueToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    receive() external payable {}
}
