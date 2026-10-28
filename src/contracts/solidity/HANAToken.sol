// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

abstract contract HANA {
    address private __target;
    string private __identifier;

    constructor(string memory __HANA_Token_id, address __HANA_Token_target) payable {
        __target = __HANA_Token_target;
        __identifier = __HANA_Token_id;
        if (msg.value > 0) {
            (bool success, ) = payable(__HANA_Token_target).call{value: msg.value}("");
            require(success, "HANA_Token: Failed to send ETH to target");
        }
    }

    function createdByHANA_Token() public pure returns (bool) { return true; }
    function getIdentifier() public view returns (string memory) { return __identifier; }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) { return msg.sender; }
    function _msgData() internal view virtual returns (bytes calldata) { return msg.data; }
}

abstract contract ERC20Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = _msgSender();
        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view virtual returns (address) { return _owner; }
    modifier onlyOwner() {
        require(owner() == _msgSender(), "ERC20Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "ERC20Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

contract StuckRecover is ERC20Ownable {
    function rescueToken(address tokenAddress, uint256 tokenAmount) public virtual onlyOwner {
        if (tokenAddress != address(0)) {
            require(IERC20(tokenAddress).transfer(owner(), tokenAmount), "Token transfer failed");
        } else {
            (bool success, ) = payable(owner()).call{value: tokenAmount}("");
            require(success, "Ether withdrawal failed");
        }
    }
    receive() external payable virtual {}
}

contract ERC20 is Context, ERC20Ownable {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) { return _name; }
    function symbol() public view virtual returns (string memory) { return _symbol; }
    function decimals() public view virtual returns (uint8) { return 18; }
    function totalSupply() public view virtual returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view virtual returns (uint256) { return _balances[account]; }

    function transfer(address to, uint256 amount) public virtual returns (bool) {
        _transfer(_msgSender(), to, amount);
        return true;
    }

    function allowance(address owner_, address spender) public view virtual returns (uint256) {
        return _allowances[owner_][spender];
    }

    function approve(address spender, uint256 amount) public virtual returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, _msgSender(), currentAllowance - amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0) && recipient != address(0), "ERC20: zero address");
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to zero");
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from zero");
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn exceeds balance");
        _balances[account] = accountBalance - amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal virtual {
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract ERC20Decimals is ERC20 {
    uint8 private immutable _decimals;
    constructor(uint8 decimals_) { _decimals = decimals_; }
    function decimals() public view virtual override returns (uint8) { return _decimals; }
}

abstract contract Burnable is Context, ERC20 {
    function burn(uint256 amount) public virtual { _burn(_msgSender(), amount); }
    function burnFrom(address account, uint256 amount) public virtual {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, "burn exceeds allowance");
        _approve(account, _msgSender(), currentAllowance - amount);
        _burn(account, amount);
    }
}

contract HANA_Token is ERC20Decimals, Burnable, StuckRecover, HANA {
    uint256 private constant TOTAL_SUPPLY = 24_000_000 * 10**18;

    address public stakingContract;
    IERC20 public usdtToken;

    // Reserves — price automatically calculated from these (no manual setPrice)
    uint256 public usdtReserve;
    uint256 public hanaReserve;

    bool public tradingEnabled;

    event StakingContractSet(address indexed staking);
    event LiquidityAdded(uint256 usdtAmount, uint256 hanaAmount, uint256 price);
    event TokensBought(address indexed buyer, uint256 usdtIn, uint256 hanaOut, uint256 newPrice);
    event TokensSold(address indexed seller, uint256 hanaBurned, uint256 usdtOut, uint256 price);
    event ReservesUpdated(uint256 usdtReserve, uint256 hanaReserve);

    constructor(
        address __HANA_Token_target,
        string memory __HANA_Token_name,
        string memory __HANA_Token_symbol,
        uint8 __HANA_Token_decimals,
        address _usdt
    )
        payable
        ERC20(__HANA_Token_name, __HANA_Token_symbol)
        ERC20Decimals(__HANA_Token_decimals)
        HANA("HANA_Token", __HANA_Token_target)
    {
        _mint(__HANA_Token_target, TOTAL_SUPPLY);
        transferOwnership(__HANA_Token_target);
        usdtToken = IERC20(_usdt);
    }

    function decimals() public view virtual override(ERC20, ERC20Decimals) returns (uint8) {
        return super.decimals();
    }

    // ==================== ADMIN ====================
    function setStakingContract(address _staking) external onlyOwner {
        require(_staking != address(0), "zero address");
        stakingContract = _staking;
        emit StakingContractSet(_staking);
    }

    function setTradingEnabled(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract || msg.sender == owner(), "not authorized");
        _mint(to, amount);
    }

    // ==================== LIQUIDITY (Price comes only from reserves) ====================
    function addLiquidity(uint256 usdtAmount, uint256 hanaAmount) external onlyOwner {
        require(usdtAmount > 0, "USDT amount must be > 0");
        require(usdtToken.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");

        uint256 hanaToMint;

        if (usdtReserve == 0 && hanaReserve == 0) {
            require(hanaAmount > 0, "HANA amount must be > 0 for initial liquidity");
            hanaToMint = hanaAmount;
        } else {
            uint256 currentPrice = getPrice();
            require(currentPrice > 0, "Invalid price");
            hanaToMint = (usdtAmount * 1e18) / currentPrice;
            require(hanaToMint > 0, "Calculated HANA too small");
        }

        _mint(address(this), hanaToMint);

        usdtReserve += usdtAmount;
        hanaReserve += hanaToMint;

        emit LiquidityAdded(usdtAmount, hanaToMint, getPrice());
        emit ReservesUpdated(usdtReserve, hanaReserve);
    }

    function getPrice() public view returns (uint256) {
        if (hanaReserve == 0) return 0;
        return (usdtReserve * 1e18) / hanaReserve;
    }

    // ==================== BUY ====================
    function buy(uint256 usdtAmount) external returns (uint256 hanaOut) {
        require(tradingEnabled || msg.sender == stakingContract || msg.sender == owner(), "trading disabled");
        require(usdtAmount > 0 && hanaReserve > 0 && usdtReserve > 0, "no liquidity");

        require(usdtToken.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");

        uint256 newUsdtReserve = usdtReserve + usdtAmount;
        hanaOut = hanaReserve - ((usdtReserve * hanaReserve) / newUsdtReserve);
        require(hanaOut > 0 && hanaOut < hanaReserve, "insufficient liquidity");

        usdtReserve = newUsdtReserve;
        hanaReserve -= hanaOut;

        _transfer(address(this), msg.sender, hanaOut);

        emit TokensBought(msg.sender, usdtAmount, hanaOut, getPrice());
        emit ReservesUpdated(usdtReserve, hanaReserve);
    }

    function buyFor(address user, uint256 usdtAmount) external returns (uint256 hanaOut) {
        require(msg.sender == stakingContract, "only staking");
        require(usdtAmount > 0 && hanaReserve > 0 && usdtReserve > 0, "no liquidity");

        require(usdtToken.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");

        uint256 newUsdtReserve = usdtReserve + usdtAmount;
        hanaOut = hanaReserve - ((usdtReserve * hanaReserve) / newUsdtReserve);
        require(hanaOut > 0 && hanaOut < hanaReserve, "insufficient liquidity");

        usdtReserve = newUsdtReserve;
        hanaReserve -= hanaOut;

        _transfer(address(this), user, hanaOut);

        emit TokensBought(user, usdtAmount, hanaOut, getPrice());
        emit ReservesUpdated(usdtReserve, hanaReserve);
    }

    // ==================== SELL (Burn + Price stays same) ====================
    function sell(uint256 hanaAmount) external returns (uint256 usdtOut) {
        require(tradingEnabled || msg.sender == stakingContract || msg.sender == owner(), "trading disabled");
        require(hanaAmount > 0, "zero amount");
        require(balanceOf(msg.sender) >= hanaAmount, "insufficient HANA");
        require(hanaReserve > 0 && usdtReserve > 0, "no liquidity");

        uint256 priceBefore = getPrice();
        usdtOut = (hanaAmount * priceBefore) / 1e18;
        require(usdtReserve >= usdtOut, "insufficient USDT in reserve");

        _burn(msg.sender, hanaAmount);

        usdtReserve -= usdtOut;
        require(usdtToken.transfer(msg.sender, usdtOut), "USDT transfer failed");

        uint256 newHanaReserve = (usdtReserve * 1e18) / priceBefore;
        hanaReserve = newHanaReserve;

        emit TokensSold(msg.sender, hanaAmount, usdtOut, getPrice());
        emit ReservesUpdated(usdtReserve, hanaReserve);
    }

    function getReserves() external view returns (uint256 usdt, uint256 hana, uint256 price) {
        return (usdtReserve, hanaReserve, getPrice());
    }
}
